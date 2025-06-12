"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const contact_service_1 = require("../services/contact.service");
const validators_1 = require("../utils/validators");
class ContactController {
    constructor() {
        this.identify = async (req, res) => {
            try {
                const { email, phoneNumber } = req.body;
                if (!email && !phoneNumber) {
                    return res.status(400).json({ error: 'Either email or phoneNumber must be provided' });
                }
                const emailValidation = validators_1.ValidationUtils.validateEmail(email);
                const phoneValidation = validators_1.ValidationUtils.validatePhoneNumber(phoneNumber);
                // Validate email if provided
                if (email) {
                    if (!emailValidation.isValid) {
                        return res.status(400).json({ error: 'Invalid email format' });
                    }
                }
                // Validate phone number if provided (simple digits-only, 7–15 characters)
                if (phoneNumber) {
                    if (!phoneValidation.isValid) {
                        return res.status(400).json({ error: 'Invalid phone number format' });
                    }
                }
                const response = await this.contactService.identifyContact({ email, phoneNumber });
                res.status(200).json(response);
            }
            catch (error) {
                console.error('Error in identify:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        };
        this.contactService = new contact_service_1.ContactService();
    }
}
exports.ContactController = ContactController;
