import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';
import { ValidationUtils } from '../utils/validators';

export class ContactController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  public identify = async (req: Request, res: Response) => {
    try {
      const { email, phoneNumber } = req.body;
      
      if (!email && !phoneNumber) {
        return res.status(400).json({ error: 'Either email or phoneNumber must be provided' });
      }

          const emailValidation = ValidationUtils.validateEmail(email);
          const phoneValidation = ValidationUtils.validatePhoneNumber(phoneNumber);
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
    } catch (error) {
      console.error('Error in identify:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}