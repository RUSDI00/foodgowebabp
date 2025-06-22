"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const seed_1 = require("./db/seed");
const startServer = async () => {
    try {
        // Seed database with initial data
        await (0, seed_1.seedDatabase)();
        // Start server
        app_1.default.listen(config_1.config.port, () => {
            console.log(`🚀 Server running on http://localhost:${config_1.config.port}`);
            console.log(`📝 API documentation: http://localhost:${config_1.config.port}/api/health`);
            console.log(`🌍 Environment: ${config_1.config.nodeEnv}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map