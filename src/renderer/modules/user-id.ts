import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { remote } from "electron";
import { readTextFile, writeTextFile } from '../helpers/fs';

const USER_ID_FILENAME = 'user-id';

/**
 * This module handle the user identity
 */
export class UserID{

  private static id: string = '';

  /**
   * Return the user id
   */
  public static getId(){
    return this.id;
  }

  /**
   * Reads the user id from the filesystem, if it does not exits yet, it generate a new one and save it
   */
  static async init(){
    const filename = this.getIdFilename();
    let userId = await this.readUserId(filename);
    if(userId){
      this.id = userId;
    }else{
      userId = uuidv4();
      try {
        await writeTextFile(filename, userId);
        this.id = userId;
      } catch (error) {
        console.error('Couldn\'t save the generated User Id');
        console.error(error);
      }
    }
  }

  /**
   * Reads the user id from a file
   * @param filename UserId's filename
   */
  static async readUserId(filename: string){
    try {
      return await readTextFile(filename);
    } catch (error) {
      return '';
    }
  }

  /**
   * Returns path/filename of the user id file
   */
  static getIdFilename(){
    const userDataDir = remote.app.getPath('userData');
    return path.join(userDataDir, USER_ID_FILENAME);
  }

}
