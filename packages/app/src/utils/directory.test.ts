import { describe, expect, it } from "bun:test"
import { directoryKey } from "./directory"

describe("directoryKey", () => {
  it("normalizes windows slash styles to one key", () => {
    expect(directoryKey("C:\\Users\\moked\\testing")).toBe("C:/Users/moked/testing")
    expect(directoryKey("C:/Users/moked/testing")).toBe("C:/Users/moked/testing")
    expect(directoryKey("C:\\Users\\moked\\testing\\")).toBe("C:/Users/moked/testing")
  })

  it("normalizes windows drive roots", () => {
    expect(directoryKey("C:\\")).toBe("C:/")
    expect(directoryKey("C:/")).toBe("C:/")
  })

  it("normalizes unix roots", () => {
    expect(directoryKey("/")).toBe("/")
    expect(directoryKey("////")).toBe("/")
  })
})
