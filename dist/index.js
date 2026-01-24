"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const doorDashConfig_1 = __importDefault(require("./config/doorDashConfig"));
// Start server
const port = doorDashConfig_1.default.port;
app_1.default.listen(port, () => {
    console.log(`🚀 SeekerEats Relay API listening on port ${port}`);
    console.log(`📝 DoorDash Developer ID: ${doorDashConfig_1.default.developerId.substring(0, 8)}...`);
    console.log(`✅ Server ready for deliveries`);
});
//# sourceMappingURL=index.js.map