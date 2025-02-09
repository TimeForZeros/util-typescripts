import * as chai from "chai";
import * as filesystem from "../filesystem/lib/index.js";

describe("filesystem", () => {
  it("should get all file paths", async () => {
    const paths = await filesystem.getAllFilePaths("./src");
    chai.expect(paths).to.be.an("array").and.be.not.empty;
  });
  it('should return an object with files and directories', async () => {
    const outcome = await filesystem.getDirContentPaths("./src");
    chai.expect(outcome.files).to.be.an("array");
    chai.expect(outcome.directories).to.be.an("array");
  }
});