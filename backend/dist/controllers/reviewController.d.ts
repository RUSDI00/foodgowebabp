import { Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getProductReviews: RequestHandler;
export declare const addProductReview: (req: AuthRequest, res: Response) => Response<any, Record<string, any>>;
export declare const getProductAverageRating: RequestHandler;
export declare const deleteReview: (req: AuthRequest, res: Response) => Response<any, Record<string, any>>;
//# sourceMappingURL=reviewController.d.ts.map