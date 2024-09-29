import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import { safeDecode } from '@/utils/base64'

function ArchiveDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [taskKeys, setTaskKeys] = useState<string[]>([])
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (props.open) {
      fetch('/task/keys')
        .then(res => res.json())
        .then(data => {
          setTaskKeys((data as string[]).reverse())
        })
    }
  }, [props.open])

  const fetchTaskDetails = async (key: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/task/detail/${key}`)
      const data = await res.json()
      setSelectedTask(data)
    } catch (error) {
      window.alert('Get task detail failed')
    } finally {
      setLoading(false)
    }
  }

  const parsedTask = selectedTask ? JSON.parse(selectedTask) : null

  const downloadVtt = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/vtt' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Archive</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <div className="space-y-2">
              {taskKeys.map((key) => (
                <Button
                  key={key}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => fetchTaskDetails(key)}
                >
                  {safeDecode(key)}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <ScrollArea className="h-[300px] w-full rounded-md border p-6">
            {loading ? (
              <p>Loading...</p>
            ) : selectedTask ? (
              <div>
                <p className='mb-8'>Status: {parsedTask.status}</p>
                {parsedTask.status === 'success' && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => downloadVtt(parsedTask.raw, 'original.vtt')}
                      className="w-full"
                    >
                      Download Original Subtitles
                    </Button>
                    <Button
                      onClick={() => downloadVtt(parsedTask.translatedVtt, 'translated.vtt')}
                      className="w-full"
                    >
                      Download Translated Subtitles
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Select a task to view details and download
              </p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ArchiveDialog