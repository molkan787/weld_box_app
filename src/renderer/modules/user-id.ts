import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { remote } from "electron";
import { readFile, writeFile } from '../helpers/fs';

const USER_ID_FILENAME = 'user-id';

export class UserID{

  private static id: string = '';

  public static getId(){
    return this.id;
  }

  static async init(){
    const filename = this.getIdFilename();
    let userId = await this.readUserId(filename);
    if(userId){
      this.id = userId;
    }else{
      userId = uuidv4();
      try {
        await writeFile(filename, userId);
        this.id = userId;
      } catch (error) {
        console.error('Couldn\'t save the generated User Id');
        console.error(error);
      }
    }
  }

  static async readUserId(filename: string){
    try {
      return await readFile(filename);
    } catch (error) {
      return '';
    }
  }

  static getIdFilename(){
    const userDataDir = remote.app.getPath('userData');
    return path.join(userDataDir, USER_ID_FILENAME);
  }

}
