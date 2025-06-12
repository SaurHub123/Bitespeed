"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const database_1 = __importDefault(require("../config/database"));
const validators_1 = require("../utils/validators");
class ContactService {
    async identifyContact(data) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to identify contact: ${errorMessage}`);
        }
    }
    validateInput(data) {
        const { email, phoneNumber } = data;
        if (!email && !phoneNumber) {
            throw new Error('Either email or phoneNumber must be provided');
        }
        if (email) {
            const emailValidation = validators_1.ValidationUtils.validateEmail(email);
            if (!emailValidation.isValid) {
                throw new Error(emailValidation.message || 'Invalid email format');
            }
        }
        if (phoneNumber) {
            const phoneValidation = validators_1.ValidationUtils.validatePhoneNumber(phoneNumber);
            if (!phoneValidation.isValid) {
                throw new Error(phoneValidation.message || 'Invalid phone number format');
            }
        }
    }
    async findMatchingContacts(email, phoneNumber) {
        return await database_1.default.contact.findMany({
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
    async createPrimaryContact(email, phoneNumber) {
        const newContact = await database_1.default.contact.create({
            data: {
                email: email || null,
                phoneNumber: phoneNumber || null,
                linkPrecedence: 'primary'
            }
        });
        return this.formatResponse(newContact);
    }
    async resolvePrimaryContact(contacts) {
        let primaryContact = contacts.find(c => c.linkPrecedence === 'primary');
        if (!primaryContact && contacts[0].linkedId) {
            const linkedPrimary = await database_1.default.contact.findFirst({
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
                await database_1.default.contact.update({
                    where: { id: primaryContact.id },
                    data: { linkPrecedence: 'primary', linkedId: null }
                });
            }
        }
        return primaryContact;
    }
    checkForNewInformation(contacts, email, phoneNumber) {
        if (!email && !phoneNumber)
            return false;
        return Boolean((email && !contacts.some(c => c.email === email)) ||
            (phoneNumber && !contacts.some(c => c.phoneNumber === phoneNumber)));
    }
    async createSecondaryContact(primaryId, email, phoneNumber) {
        await database_1.default.contact.create({
            data: {
                email: email || null,
                phoneNumber: phoneNumber || null,
                linkedId: primaryId,
                linkPrecedence: 'secondary'
            }
        });
    }
    async findAllLinkedContacts(primaryId) {
        return await database_1.default.contact.findMany({
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
    async consolidateContacts(primaryId, contacts) {
        const otherPrimaries = contacts.filter(c => c.id !== primaryId &&
            c.linkPrecedence === 'primary');
        if (otherPrimaries.length > 0) {
            await database_1.default.contact.updateMany({
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
    formatResponse(primaryContact, allContacts = []) {
        const contacts = allContacts.length > 0 ? allContacts : [primaryContact];
        const emails = contacts
            .map(c => c.email)
            .filter((email) => email !== null);
        const phoneNumbers = contacts
            .map(c => c.phoneNumber)
            .filter((phone) => phone !== null);
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
exports.ContactService = ContactService;
