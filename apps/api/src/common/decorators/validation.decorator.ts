import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validates that a string does not contain SQL injection patterns
 */
@ValidatorConstraint({ name: 'isNotSQLInjection', async: false })
export class IsNotSQLInjectionConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (typeof text !== 'string') return true;

    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(--|;|\/\*|\*\/|xp_|sp_)/gi,
      /(\bOR\b.*=.*)/gi,
      /(\bAND\b.*=.*)/gi,
      /(UNION.*SELECT)/gi,
    ];

    return !sqlInjectionPatterns.some((pattern) => pattern.test(text));
  }

  defaultMessage(args: ValidationArguments) {
    return 'Text contains potentially dangerous SQL patterns';
  }
}

export function IsNotSQLInjection(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotSQLInjectionConstraint,
    });
  };
}

/**
 * Validates that a string does not contain XSS patterns
 */
@ValidatorConstraint({ name: 'isNotXSS', async: false })
export class IsNotXSSConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (typeof text !== 'string') return true;

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // onclick, onerror, etc.
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
    ];

    return !xssPatterns.some((pattern) => pattern.test(text));
  }

  defaultMessage(args: ValidationArguments) {
    return 'Text contains potentially dangerous XSS patterns';
  }
}

export function IsNotXSS(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotXSSConstraint,
    });
  };
}

/**
 * Validates that a string is a strong password
 * - At least 8 characters
 * - Contains uppercase and lowercase letters
 * - Contains numbers
 * - Contains special characters
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (typeof password !== 'string') return false;

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

/**
 * Validates that a file extension is in the allowed list
 */
export function IsAllowedFileExtension(
  allowedExtensions: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAllowedFileExtension',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [allowedExtensions],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const [allowedExts] = args.constraints;
          const ext = value.split('.').pop()?.toLowerCase();
          return ext ? allowedExts.includes(ext) : false;
        },
        defaultMessage(args: ValidationArguments) {
          const [allowedExts] = args.constraints;
          return `File extension must be one of: ${allowedExts.join(', ')}`;
        },
      },
    });
  };
}

/**
 * Validates that a string is a valid phone number (US format)
 */
@ValidatorConstraint({ name: 'isPhoneNumber', async: false })
export class IsPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phone: string, args: ValidationArguments) {
    if (typeof phone !== 'string') return false;

    // Matches various US phone number formats
    const phonePattern = /^(\+1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    return phonePattern.test(phone);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid phone number format. Use format: (123) 456-7890 or 123-456-7890';
  }
}

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneNumberConstraint,
    });
  };
}

/**
 * Sanitizes HTML to prevent XSS
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== 'string') return '';

  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates URL format and protocol
 */
@ValidatorConstraint({ name: 'isSafeUrl', async: false })
export class IsSafeUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (typeof url !== 'string') return false;

    try {
      const parsedUrl = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      return allowedProtocols.includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'URL must be a valid HTTP or HTTPS URL';
  }
}

export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeUrlConstraint,
    });
  };
}
