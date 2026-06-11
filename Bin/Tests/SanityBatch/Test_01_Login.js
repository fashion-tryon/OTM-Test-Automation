"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const CommonFunctions_1 = require("../../Src/Util/CommonFunctions");
const Constants_1 = require("../../Src/Util/Constants");
const TestUtil_1 = require("../../Src/Util/TestUtil");
describe('Test_01_Login', function () {
    let objTestUtil;
    before(async function () {
        await Constants_1.Constants.init_TestConfig(__filename, module.filename, this);
        objTestUtil = new TestUtil_1.TestUtil(Constants_1.Constants.driver, Constants_1.Constants.sURL, Constants_1.Constants.TEST_LOG_FOLDER, Constants_1.Constants.TESTCASE_NAME, Constants_1.Constants.TEST_SUMMARY_FILE);
    });
    it('Login', async function () {
        await objTestUtil.loadURL(Constants_1.Constants.sURL);
        let ishomepagedisplayed = await objTestUtil.login(Constants_1.Constants.DBA_USERNAME, Constants_1.Constants.DBA_PASSWORD);
        await chai_1.assert.equal(true, ishomepagedisplayed, "HomePage verification");
    });
    after(async function () {
        await CommonFunctions_1.CommonFunctions.afterTest(this.currentTest.state);
    });
});
