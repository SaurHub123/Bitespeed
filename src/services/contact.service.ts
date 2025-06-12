import prisma from '../config/database';
import { ContactRecord, ContactResponse, ContactInput } from '../interfaces/contact.interface';
import { ValidationUtils } from '../utils/validators';

export class ContactService {
  async identifyContact(data: ContactInput): Promise<ContactResponse> {
    const { email, phoneNumber } = data;

    try {
      this.validateInput(data);
      const matchingContacts = await this.findMatchingContacts(email, phoneNumber);

      if (matchingContacts.length === 0) {
        return this.createPrimaryContact(email, phoneNumber);
      }

      const primaryContact = await this.resolvePrimaryContact(matchingContacts);
      const hasNewInfo = this.checkForNewInformation(matchingContacts, email, phoneNumber);

      if (hasNewInfo) {
        await this.createSecondaryContact(primaryContact.id, email, phoneNumber);
      }

      const allContacts = await this.findAllLinkedContacts(primaryContact.id);
      await this.consolidateContacts(primaryContact.id, allContacts);

      return this.formatResponse(primaryContact, allContacts);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to identify contact: ${errorMessage}`);
    }
  }

  private validateInput(data: ContactInput): void {
    const { email, phoneNumber } = data;
    if (!email && !phoneNumber) {
      throw new Error('Either email or phoneNumber must be provided');
    }

    if (email) {
      const emailValidation = ValidationUtils.validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.message || 'Invalid email format');
      }
    }

    if (phoneNumber) {
      const phoneValidation = ValidationUtils.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.message || 'Invalid phone number format');
      }
    }
  }

  private async findMatchingContacts(email?: string, phoneNumber?: string): Promise<ContactRecord[]> {
    return await prisma.contact.findMany({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: phoneNumber || undefined }
        ],
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  private async createPrimaryContact(email?: string, phoneNumber?: string): Promise<ContactResponse> {
    const newContact = await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: 'primary'
      }
    });
    return this.formatResponse(newContact);
  }

  private async resolvePrimaryContact(contacts: ContactRecord[]): Promise<ContactRecord> {
    let primaryContact = contacts.find(c => c.linkPrecedence === 'primary');
    
    if (!primaryContact && contacts[0].linkedId) {
      const linkedPrimary = await prisma.contact.findFirst({
        where: {
          id: contacts[0].linkedId,
          linkPrecedence: 'primary',
          deletedAt: null
        }
      });
      if (linkedPrimary) {
        primaryContact = linkedPrimary;
      }
    }

    if (!primaryContact) {
      primaryContact = contacts[0];
      if (primaryContact.linkPrecedence === 'secondary') {
        await prisma.contact.update({
          where: { id: primaryContact.id },
          data: { linkPrecedence: 'primary', linkedId: null }
        });
      }
    }

    return primaryContact;
  }

  private checkForNewInformation(contacts: ContactRecord[], email?: string, phoneNumber?: string): boolean {
    if (!email && !phoneNumber) return false;
    return Boolean(
      (email && !contacts.some(c => c.email === email)) || 
      (phoneNumber && !contacts.some(c => c.phoneNumber === phoneNumber))
    );
  }

  private async createSecondaryContact(primaryId: number, email?: string, phoneNumber?: string): Promise<void> {
    await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkedId: primaryId,
        linkPrecedence: 'secondary'
      }
    });
  }

  private async findAllLinkedContacts(primaryId: number): Promise<ContactRecord[]> {
    return await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryId },
          { linkedId: primaryId }
        ],
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  private async consolidateContacts(primaryId: number, contacts: ContactRecord[]): Promise<void> {
    const otherPrimaries = contacts.filter(c => 
      c.id !== primaryId && 
      c.linkPrecedence === 'primary'
    );

    if (otherPrimaries.length > 0) {
      await prisma.contact.updateMany({
        where: {
          id: { in: otherPrimaries.map(c => c.id) }
        },
        data: {
          linkPrecedence: 'secondary',
          linkedId: primaryId
        }
      });
    }
  }

  private formatResponse(primaryContact: ContactRecord, allContacts: ContactRecord[] = []): ContactResponse {
    const contacts = allContacts.length > 0 ? allContacts : [primaryContact];
    
    const emails = contacts
      .map(c => c.email)
      .filter((email): email is string => email !== null);

    const phoneNumbers = contacts
      .map(c => c.phoneNumber)
      .filter((phone): phone is string => phone !== null);

    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails: [...new Set(emails)],
        phoneNumbers: [...new Set(phoneNumbers)],
        secondaryContactIds: contacts
          .filter(c => c.id !== primaryContact.id)
          .map(c => c.id)
      }
    };
  }
}