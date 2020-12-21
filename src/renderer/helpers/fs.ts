import { remote } from 'electron';
const { dialog } = remote;
const fs = remote.require('fs');

/**
 * Prompt the user to select a directory
 */
export async function promptDirectory(): Promise<string | null> {
  const resp = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (resp.canceled) return null

  return resp.filePaths[0]
}

/**
 * Prompt the user to select a file to open/read
 */
export async function promptFile(): Promise<string | null> {
  const resp = await dialog.showOpenDialog({})
  if (resp.canceled) return null

  return resp.filePaths[0]
}

/**
 * Prompt the user to select where to save a file
 */
export async function promptSaveFile(): Promise<string | null> {
  const resp = await dialog.showSaveDialog({
    filters: [
      { name: 'JSON (Temporary)', extensions: ['json'] }
    ]
  })
  if (resp.canceled) return null

  return <string>resp.filePath
}

/**
 * Reads file content and returns it (utf8 text files)
 * @param filename The filename to read
 */
export function readFile(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err: Error, contents: string) => {
      err ? reject(err) : resolve(contents)
    })
  })
}

/**
 * Write string data to a file
 * @param filename Filename to write to
 * @param data Data string to write
 */
export function writeFile(filename: string, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err: Error | null) => {
      err ? reject(err) : resolve()
    })
  })
}
