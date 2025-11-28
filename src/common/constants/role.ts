export const USER_ROLE = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
