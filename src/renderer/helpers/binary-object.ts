import { serialize, deserialize } from 'bson';

export class BinaryObject{

  public static DEFAULT_XOR = 139;

  public static encode(object: any, xor?: number): Buffer{
    const _xor = xor || this.DEFAULT_XOR;
    const buff = serialize(object);
    for(let i = 0; i < buff.length; i++){
        buff[i] ^= _xor;
    }
    return buff;
  }

  public static decode(buffer: Buffer, xor?: number): any{
    const _xor = xor || this.DEFAULT_XOR;
    for(let i = 0; i < buffer.length; i++){
      buffer[i] ^= _xor;
    }
    return deserialize(buffer);
  }

}
