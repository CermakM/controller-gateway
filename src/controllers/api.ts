import {Response, Request} from "express";

/**
 * GET /api
 * List of API examples.
 */
export const APIController = (req: Request, res: Response) => {
    res.render("api/index", {
        title: "API Examples"
    });
};

export default APIController;