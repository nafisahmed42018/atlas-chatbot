"use client"

import { useAtomValue } from "jotai"
import { WidgetAuthScreen } from "@/modules/widget/ui/screens/widget-auth-screen"
import { screenAtom } from "@/modules/widget/atoms/widget-atom"
import { WidgetErrorScreen } from "../screens/widget-error-screen"
import { WidgetLoadingScreen } from "../screens/widget-loading-screen"

interface Props {
  organizationId: string
}

export const WidgetView = ({ organizationId }: Props) => {
  const screen = useAtomValue(screenAtom)

  const screenComponents = {
    error: <WidgetErrorScreen />,
    loading: <WidgetLoadingScreen organizationId={organizationId} />,
    auth: <WidgetAuthScreen />,
    inbox: <p>TODO: Inbox</p>,
    selection: <p>TODO: Selection</p>,
    chat: <p>TODO: Chat</p>,
    contact: <p>TODO: Contact</p>,
  }

  return (
    // TODO: Confirm whether or not "min-h-screen" and "min-w-screen" is needed
    <main className="flex h-full min-h-screen w-full min-w-screen flex-col overflow-hidden rounded-xl border bg-muted">
      {screenComponents[screen]}
    </main>
  )
}
