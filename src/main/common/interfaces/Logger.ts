/**
 * @interface
 * Interface for logging messages.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Logger{
  debug(message: any, ...args: any[]): void;

  info(message: any, ...args: any[]): void;

  warn(message: any, ...args: any[]): void;

  error(message: any, ...args: any[]): void;
}