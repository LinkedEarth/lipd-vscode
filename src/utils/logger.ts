/**
 * Log levels enum
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Logger class for handling logs in the extension
 */
export class Logger {
  private static instance: Logger;
  private outputChannel: any = null;
  private logLevel: LogLevel = LogLevel.INFO;

  /**
   * Get the singleton instance of Logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Initialize the logger with an output channel
   * @param channel VS Code output channel
   * @param level Initial log level
   */
  public initialize(channel: any = null, level: LogLevel = LogLevel.INFO): void {
    this.outputChannel = channel;
    this.logLevel = level;
    // this.outputChannel.show(true);
  }

  /**
   * Set the current log level
   * @param level Log level to set
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get the current log level
   * @returns Current log level
   */
  public getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param args Additional arguments for formatting
   */
  public debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.log('DEBUG', message, ...args);
    }
  }

  /**
   * Log an info message
   * @param message Message to log
   * @param args Additional arguments for formatting
   */
  public info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.log('INFO', message, ...args);
    }
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param args Additional arguments for formatting
   */
  public warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.log('WARN', message, ...args);
    }
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param args Additional arguments for formatting
   */
  public error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.log('ERROR', message, ...args);
    }
  }

  /**
   * Show the output channel
   */
  public show(): void {
    this.outputChannel?.show(true);
  }

  /**
   * Internal log method
   * @param level Log level as string
   * @param message Message to log
   * @param args Additional arguments for formatting
   */
  private log(level: string, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level}] ${message}`;
    
    // Format message with arguments if provided
    if (args.length > 0) {
      formattedMessage = this.formatMessage(formattedMessage, ...args);
    }

    // Log to VS Code output channel if available
    if (this.outputChannel) {
      this.outputChannel.appendLine(formattedMessage);
    } else {
      // Fallback to console
      switch (level) {
        case 'DEBUG':
          console.debug(formattedMessage);
          break;
        case 'INFO':
          console.info(formattedMessage);
          break;
        case 'WARN':
          console.warn(formattedMessage);
          break;
        case 'ERROR':
          console.error(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }
  }

  /**
   * Format a message with arguments (simple printf-like format)
   * @param message Base message with placeholders
   * @param args Arguments to insert
   * @returns Formatted message
   */
  private formatMessage(message: string, ...args: any[]): string {
    let formatted = message;
    let i = 0;
    
    return formatted.replace(/%s|%d|%f|%j/g, (match) => {
      if (i >= args.length) {
        return match;
      }
      
      const arg = args[i++];
      switch (match) {
        case '%s':
          return String(arg);
        case '%d':
          return Number(arg).toString();
        case '%f':
          return parseFloat(arg).toString();
        case '%j':
          return JSON.stringify(arg);
        default:
          return match;
      }
    });
  }
} 