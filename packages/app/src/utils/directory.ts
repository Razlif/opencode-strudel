export function directoryKey(directory: string) {
  const drive = directory.match(/^([A-Za-z]:)[\\/]+$/)
  if (drive) return `${drive[1]}${directory.includes("\\") ? "\\" : "/"}`
  if (/^[\\/]+$/.test(directory)) return directory.includes("\\") ? "\\" : "/"
  return directory.replace(/[\\/]+$/, "")
}
