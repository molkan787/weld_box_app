import { remote } from 'electron';
const { dialog } = remote;
const fs = remote.require('fs');

const Weld_Extension = 'wld';

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
  const resp = await dialog.showOpenDialog({
    filters: [
      { name: 'Weld Project', extensions: [Weld_Extension] }
    ]
  })
  if (resp.canceled) return null
  return resp.filePaths[0];
}

/**
 * Prompt the user to select where to save a file
 */
export async function promptSaveFile(): Promise<string | null> {
  const resp = await dialog.showSaveDialog({
    filters: [
      { name: 'Weld Project', extensions: [Weld_Extension] }
    ]
  })
  if (resp.canceled) return null

  const Full_Ext = '.' + Weld_Extension;
  let fn = <string>resp.filePath;
  if(!fn.endsWith(Full_Ext)){
    fn += Full_Ext;
  }

  return fn
}

/**
 * Reads file content and returns
 * @param filename The filename to read
 */
export function readFile(filename: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err: Error, contents: Buffer) => {
      err ? reject(err) : resolve(contents)
    })
  })
}

/**
 * Write string data to a file
 * @param filename Filename to write to
 * @param data Data buffer to write
 */
export function writeFile(filename: string, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err: Error | null) => {
      err ? reject(err) : resolve()
    })
  })
}

/**
 * Write string data to a file
 * @param filename Filename to write to
 * @param data Data string to write
 */
export function writeTextFile(filename: string, data: string){
  return writeFile(filename, Buffer.from(data, 'utf8'));
}

/**
 * Reads file content and returns it (utf8 text files)
 * @param filename The filename to read
 */
export async function readTextFile(filename: string){
  return (await readFile(filename)).toString();
}
