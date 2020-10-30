import { remote } from 'electron';
const { dialog } = remote;
const fs = remote.require('fs');

export async function promptDirectory(): Promise<string | null> {
  const resp = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (resp.canceled) return null

  return resp.filePaths[0]
}

export async function promptFile(): Promise<string | null> {
  const resp = await dialog.showOpenDialog({})
  if (resp.canceled) return null

  return resp.filePaths[0]
}

export async function promptSaveFile(): Promise<string | null> {
  const resp = await dialog.showSaveDialog({
    filters: [
      { name: 'JSON (Temporary)', extensions: ['json'] }
    ]
  })
  if (resp.canceled) return null

  return <string>resp.filePath
}

export function readFile(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err: Error, contents: string) => {
      err ? reject(err) : resolve(contents)
    })
  })
}

export function writeFile(filename: string, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err: Error | null) => {
      err ? reject(err) : resolve()
    })
  })
}
