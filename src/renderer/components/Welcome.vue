<template>
  <div class="welcome">
    <div class="col">
      <div class="header">
        <LogoIcon :size="100" />
        <h1>Weld.dev</h1>
        <h4>{{ texts.app_logo_subheader }}</h4>
      </div>
      <div class="big-text">{{ texts.header }}</div>
      <p>{{ texts.body }}</p>
      <button @click="createClick" class="primary btn">Create Project...</button>
      <div style="height: 50px"></div>
    </div>
  </div>
</template>

<script>
import { Menu } from '../modules/menu';
import LogoIcon from './icons/Logo';
import { config } from '../config';
export default {
  components: {
    LogoIcon
  },
  data: () => ({
    texts: config.welcome_page
  }),
  methods: {
    createClick(){
      Menu.emit('new');
    }
  }
}
</script>

<style lang="less" scoped>
.welcome{
  display: table;
  width: 100%;
  height: 100%;
  color: white;
  .col{
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    .header{
      width: 265px;
      display: inline-block;
      svg, h1, h4{
        float: left;
      }
      svg{
        margin-right: 20px;
      }
      h1{
        margin-bottom: 0;
      }
      h4{
        margin: 0;
      }
    }
    .big-text{
      font-size: 50px;
      margin-top: 40px;
    }
    p{
      color: white;
      opacity: 0.7;
    }
    .btn{
      width: 350px;
      padding: 18px;
      font-weight: bold;
      margin-top: 20px;
    }
  }
}
</style>
