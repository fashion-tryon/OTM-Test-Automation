"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
const CommonFunctions_1 = require("./CommonFunctions");
var path = require('path');
const fs = require('fs');
class Constants {
    static async init_TestConfig(sParentFolderPath, sFilePath, testObj) {
        let sParentFolder = await path.dirname(sParentFolderPath).split(path.sep).pop();
        this.TESTCASE_NAME = sFilePath.slice(sParentFolderPath.lastIndexOf(path.sep) + 1, sFilePath.length - 3);
        this.TEST_DATA_FOLDER = await path.join(this.PROJECT_FOLDER, "Testdata", sParentFolder);
        this.TEST_CONFIG_FILE = await require(await path.join(this.TEST_DATA_FOLDER, "TestConfig.json"));
        this.TEST_LOG_FOLDER = await path.join(this.PROJECT_FOLDER, "Results", sParentFolder, "Logs");
        this.TEST_LOG_FILE = await path.join(this.TEST_LOG_FOLDER, this.TESTCASE_NAME + ".log");
        this.TEST_SUMMARY_FILE = await path.join(this.PROJECT_FOLDER, "Results", sParentFolder, "Testsummary.txt");
        this.TEST_DATA_FILE = await path.join(this.TEST_DATA_FOLDER, this.TESTCASE_NAME + ".txt");
        this.TEST_DATA_FILE_IN_JSON = await path.join(this.TEST_DATA_FOLDER, this.TESTCASE_NAME + ".json");
        try {
            if (fs.existsSync(Constants.TEST_DATA_FILE_IN_JSON)) {
                this.JSON_DATA = await require(Constants.TEST_DATA_FILE_IN_JSON);
            }
        }
        catch (err) {
            console.error(err);
        }
        this.TEST_SCREENSHOT_FOLDER = await path.join(this.PROJECT_FOLDER, "Results", sParentFolder, "Screenshots");
        await CommonFunctions_1.CommonFunctions.createFolder(path.join("Results", sParentFolder), "Logs,Screenshots");
        this.TEST_OBJECT = testObj;
        this.envConfig = JSON.parse(fs.readFileSync(path.join(Constants.PROJECT_FOLDER, "EnvironmentConfig.json"), "utf8"));
        this.sURL = await this.getURL();
        this.sBROWSER = await this.getBrowser();
        this.DBA_USERNAME = await this.envConfig["DBA_USERNAME"];
        this.DBA_PASSWORD = await this.envConfig["DBA_PASSWORD"];
        this.driver = await CommonFunctions_1.CommonFunctions.getDriver(this.sBROWSER);
        await this.setTimeouts(this.envConfig.ELEMENT_TIMEOUT, this.envConfig.ELEMENT_TIMEOUT, this.envConfig.ELEMENT_TIMEOUT);
    }
    static async getURL() {
        let strURL = "";
        strURL = await Constants.envConfig["URL"];
        return strURL;
    }
    static async setTimeouts(intObjectLoadTimeOut = "", intPageLoadTimeout = "", intScriptTimeout = "") {
        if (intObjectLoadTimeOut != "")
            this.OBJECT_LOAD_TIMEOUT = intObjectLoadTimeOut;
        if (intPageLoadTimeout != "")
            this.PAGE_LOAD_TIMEOUT = intPageLoadTimeout;
        if (intScriptTimeout != "")
            this.SCRIPT_TIMEOUT = intScriptTimeout;
        await this.driver.manage().setTimeouts({ implicit: this.OBJECT_LOAD_TIMEOUT, pageLoad: this.PAGE_LOAD_TIMEOUT, script: this.SCRIPT_TIMEOUT });
    }
    static async getBrowser() {
        let strBrowser = await this.envConfig.BROWSER;
        return strBrowser;
    }
}
exports.Constants = Constants;
Constants.CHROME_POPUP_WAITTIME = 5000;
Constants.FIREFOX_POPUP_WAITTIME = 8000;
Constants.PROJECT_FOLDER = process.cwd();
