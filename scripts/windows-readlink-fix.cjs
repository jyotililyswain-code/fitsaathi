// Some Windows volumes report EISDIR instead of EINVAL when readlink inspects
// an ordinary file. Next.js output tracing expects EINVAL for non-symlinks.
if (process.platform === "win32") {
  const fs = require("node:fs");
  const normalize = error => {
    if (error && error.code === "EISDIR") error.code = "EINVAL";
    return error;
  };

  const readlink = fs.readlink.bind(fs);
  fs.readlink = (...args) => {
    const callback = args[args.length - 1];
    if (typeof callback === "function") args[args.length - 1] = (error, value) => callback(normalize(error), value);
    return readlink(...args);
  };

  const readlinkSync = fs.readlinkSync.bind(fs);
  fs.readlinkSync = (...args) => {
    try { return readlinkSync(...args); }
    catch (error) { throw normalize(error); }
  };

  const readlinkPromise = fs.promises.readlink.bind(fs.promises);
  fs.promises.readlink = async (...args) => {
    try { return await readlinkPromise(...args); }
    catch (error) { throw normalize(error); }
  };
}
