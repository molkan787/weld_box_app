<template>
  <div class="form-d1">
    <slot></slot>
  </div>
</template>

<style lang="less">
.form-d1{
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  .field{
    &:not(:last-child){
      margin-bottom: 16px;
    }
    label{
      padding-left: 2px;
      font-size: 14px;
    }
    input:not([type="checkbox"]), select, textarea{
      width: 100%;
      box-sizing: border-box;
      border-radius: 6px;
      border: none;
      background: #141519;
      color: white;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: bold;
      outline: none;
      margin-top: 4px;
      resize: none;
    }
    textarea{
      font-family: inherit;
      font-weight: lighter;
    }
    &.disabled{
      input, select{
        background: #3B3D44;
        pointer-events: none;
      }
    }
  }
  .checkbox{
    margin-top: 4px;
    label{
      cursor: pointer;
    }
  }
  .capitalize{
    text-transform: capitalize;
  }
}
</style>
