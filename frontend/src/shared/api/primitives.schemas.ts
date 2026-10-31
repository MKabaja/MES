import { z } from 'zod';

export const moneySchema = z.string().regex(/^-?\d+\.\d{2}$/);

export const quantitySchema = z.string().regex(/^-?\d+\.\d{3}$/);

export const scanCodeSchema = z.string().regex(/^\d{6}$/);

export const isoDateTimeSchema = z.iso.datetime();

export const idSchema = z.int();
