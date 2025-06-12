// import prisma from '../config/database';
// import { ContactRecord, ContactResponse, ContactInput } from '../interfaces/contact.interface';
// import { ValidationUtils } from '../utils/validators';

// export class ContactService {
//   async identifyContact(data: ContactInput): Promise<ContactResponse> {
//     const { email, phoneNumber } = data;

//     // Validate input
//     this.validateInput(data);

//     try {
//       // Find all contacts that match either email or phoneNumber
//       const matchingContacts = await this.findMatchingContacts(email, phoneNumber);

//       if (matchingContacts.length === 0) {
//         return this.createPrimaryContact(email, phoneNumber);
//       }

//       const primaryContact = await this.resolvePrimaryContact(matchingContacts);
//       const hasNewInfo = this.checkForNewInformation(email, phoneNumber, matchingContacts);

//       if (hasNewInfo) {
//         await this.createSecondaryContact(email, phoneNumber, primaryContact.id);
//       }

//       const allContacts = await this.findAllLinkedContacts(primaryContact.id);
//       await this.consolidateContacts(primaryContact.id, allContacts);

//       return this.formatResponse(primaryContact, allContacts);
//     } catch (error) {
//       throw new Error(`Failed to identify contact: ${error.message}`);
//     }
//   }

//   private validateInput(data: ContactInput): void {
//     const { email, phoneNumber } = data;
//     if (!email && !phoneNumber) {
//       throw new Error('Either email or phoneNumber must be provided');
//     }

//     if (email) {
//       const emailValidation = ValidationUtils.validateEmail(email);
//       if (!emailValidation.isValid) {
//         throw new Error(emailValidation.message || 'Invalid email format');
//       }
//     }

//     if (phoneNumber) {
//       const phoneValidation = ValidationUtils.validatePhoneNumber(phoneNumber);
//       if (!phoneValidation.isValid) {
//         throw new Error(phoneValidation.message || 'Invalid phone number format');
//       }
//     }
//   }

//   private async findMatchingContacts(email?: string, phoneNumber?: string): Promise<ContactRecord[]> {
//     return await prisma.contact.findMany({
//       where: {
//         OR: [
//           { email: email || undefined },
//           { phoneNumber: phoneNumber || undefined }
//         ],
//         deletedAt: null
//       },
//       orderBy: { createdAt: 'asc' }
//     });
//   }

//   private async createPrimaryContact(email?: string, phoneNumber?: string): Promise<ContactResponse> {
//     const newContact = await prisma.contact.create({
//       data: {
//         email: email || null,
//         phoneNumber: phoneNumber || null,
//         linkPrecedence: 'primary'
//       }
//     });
//     return this.formatResponse(newContact);
//   }

//   private async resolvePrimaryContact(contacts: ContactRecord[]): Promise<ContactRecord> {
//     let primaryContact = contacts.find(c => c.linkPrecedence === 'primary');
    
//     if (!primaryContact && contacts[0].linkedId) {
//       primaryContact = await prisma.contact.findFirst({
//         where: {
//           id: contacts[0].linkedId,
//           linkPrecedence: 'primary'
//         }
//       });
//     }

//     if (!primaryContact) {
//       primaryContact = contacts[0];
//       if (primaryContact.linkPrecedence === 'secondary') {
//         await prisma.contact.update({
//           where: { id: primaryContact.id },
//           data: { linkPrecedence: 'primary', linkedId: null }
//         });
//       }
//     }

//     return primaryContact;
//   }

//   private checkForNewInformation(email?: string, phoneNumber?: string, contacts: ContactRecord[]): boolean {
//     return (email && !contacts.some(c => c.email === email)) || 
//            (phoneNumber && !contacts.some(c => c.phoneNumber === phoneNumber));
//   }

//   private async createSecondaryContact(email?: string, phoneNumber?: string, primaryId: number): Promise<void> {
//     await prisma.contact.create({
//       data: {
//         email: email || null,
//         phoneNumber: phoneNumber || null,
//         linkedId: primaryId,
//         linkPrecedence: 'secondary'
//       }
//     });
//   }

//   private async findAllLinkedContacts(primaryId: number): Promise<ContactRecord[]> {
//     return await prisma.contact.findMany({
//       where: {
//         OR: [
//           { id: primaryId },
//           { linkedId: primaryId }
//         ],
//         deletedAt: null
//       },
//       orderBy: { createdAt: 'asc' }
//     });
//   }

//   private async consolidateContacts(primaryId: number, contacts: ContactRecord[]): Promise<void> {
//     const otherPrimaries = contacts.filter(c => 
//       c.id !== primaryId && 
//       c.linkPrecedence === 'primary'
//     );

//     if (otherPrimaries.length > 0) {
//       await prisma.contact.updateMany({
//         where: {
//           id: { in: otherPrimaries.map(c => c.id) }
//         },
//         data: {
//           linkPrecedence: 'secondary',
//           linkedId: primaryId
//         }
//       });
//     }
//   }

//   private formatResponse(primaryContact: ContactRecord, allContacts: ContactRecord[] = []): ContactResponse {
//     const contacts = allContacts.length > 0 ? allContacts : [primaryContact];
    
//     return {
//       contact: {
//         primaryContactId: primaryContact.id,
//         emails: [...new Set(contacts.map(c => c.email).filter(Boolean))],
//         phoneNumbers: [...new Set(contacts.map(c => c.phoneNumber).filter(Boolean))],
//         secondaryContactIds: contacts
//           .filter(c => c.id !== primaryContact.id)
//           .map(c => c.id)
//       }
//     };
//   }
// }











import prisma from '../config/database';
import { ContactRecord, ContactResponse, ContactInput } from '../interfaces/contact.interface';
import { ValidationUtils } from '../utils/validators';

export class ContactService {
  async identifyContact(data: ContactInput): Promise<ContactResponse> {
    const { email, phoneNumber } = data;

    // Validate input
    this.validateInput(data);

    try {
      // Find all contacts that match either email or phoneNumber
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to identify contact: ${message}`);
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
      const foundContact = await prisma.contact.findFirst({
        where: {
          id: contacts[0].linkedId,
          linkPrecedence: 'primary'
        }
      });

      if (!foundContact) {
        throw new Error('Primary contact not found');
      }
      primaryContact = foundContact;
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
    const hasNewEmail = email ? !contacts.some(c => c.email === email) : false;
    const hasNewPhone = phoneNumber ? !contacts.some(c => c.phoneNumber === phoneNumber) : false;
    return hasNewEmail || hasNewPhone;
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
    
    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails: [...new Set(contacts.map(c => c.email).filter((e): e is string => e !== null))],
        phoneNumbers: [...new Set(contacts.map(c => c.phoneNumber).filter((p): p is string => p !== null))],
        secondaryContactIds: contacts
          .filter(c => c.id !== primaryContact.id)
          .map(c => c.id)
      }
    };
  }
}