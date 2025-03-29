export const sanitizeFileSystemComponent = (component: string): string => encodeURIComponent(component);

export const desanitizeFileSystemComponent = (component: string): string => decodeURIComponent(component);
