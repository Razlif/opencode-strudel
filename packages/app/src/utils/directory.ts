export function directoryKey(directory: string) {
  const text = directory.replaceAll("\\", "/")
  const drive = text.match(/^([A-Za-z]:)\/+$/)
  if (drive) return `${drive[1]}/`
  if (/^\/+$/.test(text)) return "/"
  return text.replace(/\/+$/, "")
}
