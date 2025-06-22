import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getUserNotifications: (req: AuthRequest, res: Response) => Response<any, Record<string, any>>;
export declare const markNotificationAsRead: (req: AuthRequest, res: Response) => Response<any, Record<string, any>>;
export declare const markAllNotificationsAsRead: (req: AuthRequest, res: Response) => Response<any, Record<string, any>>;
export declare const addNotification: (userId: string, message: string, type: string, link?: string) => {
    id: string;
    userId: string;
    message: string;
    type: string;
    isRead: boolean;
    link: string | undefined;
    createdAt: string;
};
export declare const deleteNotification: (req: AuthRequest, res: Response) => Response<any, Record<string, any>>;
//# sourceMappingURL=notificationController.d.ts.map