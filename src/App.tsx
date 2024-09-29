import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Check, X, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DialogClose } from '@radix-ui/react-dialog'
import useFFmpeg from "./utils/ffmpeg"
import { Progress } from './components/ui/progress'
import { AlertDialog } from '@radix-ui/react-alert-dialog'
import { AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from './components/ui/alert-dialog'
import ArchiveDialog from './components/archive-dialog'

export default function Component() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [language, setLanguage] = useState<string>("")

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    multiple: false
  })

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
  }

  const [password, setPassword] = useState('')
  const handleInputPwd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  const [open, setOpen] = useState(false)
  const [tip, setTip] = useState('')
  const [progress, setProgress] = useState(0)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('')
  const [alertDescription, setAlertDescription] = useState('')
  const handleSubmit = async () => {
    if (!uploadedFile) {
      console.error('No file uploaded')
      return;
    }
    // convert video to audio
    const arrayBuffer = await uploadedFile.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const filename = uploadedFile.name
    const audio = await useFFmpeg(uint8Array, filename, {
      onProgress: setProgress,
      onTip: setTip,
    })
    // // 下载音频进行测试
    // if (audio) {
    //   const audioUrl = URL.createObjectURL(audio)
    //   const a = document.createElement('a')
    //   a.href = audioUrl
    //   a.download = filename
    //   a.click()
    // } else {
    //   console.error('音频转换失败')
    // }

    if (!audio) {
      setAlertTitle('Audio convert failed')
      setAlertDescription('Please try again later')
      setAlertOpen(true)
      return
    }

    const formData = new FormData()
    formData.append('file', audio)
    formData.append('targetLanguage', language)
    formData.append('password', password)
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    })
    if (response.status !== 200) {
      setAlertTitle('Task creation failed')
      setAlertDescription('Please try again later')
      setAlertOpen(true)
      return
    }
    const data = await response.json<{ success: boolean }>()
    if (data.success) {
      setAlertTitle('Task created successfully')
      setAlertDescription(`You can download it later in the archive at the top right corner.
If you like this tool, <a href="https://github.com/ray-d-song/worker-ai-subtitle-translator" target="_blank">please give me a star on Github</a>.
`)
      setAlertOpen(true)
    } else {
      setAlertTitle('Task creation failed')
      setAlertDescription('Please try again later')
      setAlertOpen(true)
    }
  }

  const [archiveOpen, setArchiveOpen] = useState(false)

  useEffect(() => {
    if (!alertOpen) {
      setOpen(false)
    }
  }, [alertOpen])

  return (
    <div className="min-h-screen bg-black text-gray-200 p-8">
      <Button onClick={() => setArchiveOpen(true)} className='fixed top-10 right-10 space-x-2 bg-blue-600 hover:bg-blue-700 text-white'>
        <Archive className="h-4 w-4" />
        <span>Archive</span>
      </Button>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
          <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ArchiveDialog open={archiveOpen} onOpenChange={setArchiveOpen} />

      <div className="max-w-3xl mx-auto space-y-8 mt-32">
        <h1 className="text-3xl font-bold text-center">AI Video Subtitle Translator</h1>
        
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-blue-500 bg-blue-500 bg-opacity-10" : "border-gray-700 hover:border-gray-600"
          }`}
        >
          <input {...getInputProps()} />
          {uploadedFile ? (
            <div className="flex items-center justify-center space-x-2">
              <Check className="text-green-500" />
              <span>{uploadedFile.name}</span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setUploadedFile(null)
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p>Drag and drop your video file here, or click to select a file</p>
              <p className="text-sm text-gray-500">Supported formats: MP4, MOV, AVI, MKV</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="language-select" className="block text-sm font-medium">
            Select Target Language
          </label>
          <Select onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select" className="w-full bg-gray-800 border-gray-700 text-gray-200">
              <SelectValue placeholder="Choose a language" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="Chinese" className="text-gray-200 focus:bg-gray-700">Chinese</SelectItem>
              <SelectItem value="English" className="text-gray-200 focus:bg-gray-700">English</SelectItem>
              <SelectItem value="Spanish" className="text-gray-200 focus:bg-gray-700">Spanish</SelectItem>
              <SelectItem value="French" className="text-gray-200 focus:bg-gray-700">French</SelectItem>
              <SelectItem value="German" className="text-gray-200 focus:bg-gray-700">German</SelectItem>
              <SelectItem value="Italian" className="text-gray-200 focus:bg-gray-700">Italian</SelectItem>
              <SelectItem value="Japanese" className="text-gray-200 focus:bg-gray-700">Japanese</SelectItem>
              <SelectItem value="Korean" className="text-gray-200 focus:bg-gray-700">Korean</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!uploadedFile || !language}
            >
              Upload and Process
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Please enter your password
              </DialogTitle>
              <DialogDescription>
                The password is the env variable you set in Cloudflare worker.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col space-y-2">
              <Progress value={progress} />
              <span className="text-sm text-gray-500">{tip}</span>
            </div>
            <Input type="password" placeholder="Password" onChange={handleInputPwd} value={password} />
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={password.length === 0}>Submit</Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}