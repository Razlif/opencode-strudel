import { useParams } from "@solidjs/router"
import { createMemo } from "solid-js"
import { useLayout } from "@/context/layout"
import { useSDK } from "@/context/sdk"
import { base64Encode } from "@opencode-ai/util/encode"

export const useSessionKey = () => {
  const params = useParams()
  const sdk = useSDK()
  const sessionKey = createMemo(() => `${base64Encode(sdk.directory)}${params.id ? "/" + params.id : ""}`)
  return { params, sessionKey }
}

export const useSessionLayout = () => {
  const layout = useLayout()
  const { params, sessionKey } = useSessionKey()
  return {
    params,
    sessionKey,
    tabs: createMemo(() => layout.tabs(sessionKey)),
    view: createMemo(() => layout.view(sessionKey)),
  }
}
