export const sanitizeFileSystemComponent = (component: string): string => component.replace(/[/\0]/g, '_');
