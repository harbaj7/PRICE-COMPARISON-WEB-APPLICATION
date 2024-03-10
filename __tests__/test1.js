const homedepot = require("../homedepot.js");
//jest.setTimeout(60000);
// In package.json changed "test": "node test.js" in scripts to  "test":"jest"
describe("tests for homedepot", () => {
  it("Returns an array of urls of length 28", async () => {
    let urldata = await homedepot.getDataHD();
    expect(urldata.length).toBe(28);
  }, 60000);
  it("Return filtered links from above function", async () => {
    let filterdata = await homedepot.filterForLinks();
    expect(filterdata.length).toBe(1090);
  }, 60000);
  it("Returns the model number to the given link", async () => {
    let urlLink =
      "https://www.homedepot.ca/product/bosch-300-series-24-inch-4-0-cu-ft-condensing-dryer-energy-star-plug-adaptor-included/1001551038";
    let resultModel = await homedepot.getmodel(urlLink);
    expect(resultModel).toBe(" WTG86403UC  ");
  }, 60000);
  it("should call callback after specified delay", async () => {
    const mockCallback = jest.fn();
    setTimeout(mockCallback, 1000);
    expect(mockCallback).not.toHaveBeenCalled();
    await homedepot.timeout(1000);
    expect(mockCallback).toHaveBeenCalled();
  });
});
