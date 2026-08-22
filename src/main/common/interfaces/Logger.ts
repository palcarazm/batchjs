/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @interface
 * Interface for logging messages.
 */
export interface Logger{
  /**
   * Logs a debug message.
   * @param message The message to log.
   * @param args The arguments to log.
   */
  debug(message: any, ...args: any[]): void;

  /**
   * Logs an info message.
   * @param message The message to log.
   * @param args The arguments to log.
   */
  info(message: any, ...args: any[]): void;

  /**
   * Logs a warning message.
   * @param message The message to log.
   * @param args The arguments to log.
   */
  warn(message: any, ...args: any[]): void;

  /**
   * Logs an error message.
   * @param message The message to log.
   * @param args The arguments to log.
   */
  error(message: any, ...args: any[]): void;
}