<template>
    <div id="app">
        <MainPage />
    </div>
</template>

<script type="ts">

  import Vue from 'vue';
  import MainPage from '@/components/MainPage.vue';

  export default Vue.extend({
      components: { MainPage }
  });

</script>

<style lang="less">
html, body{
    margin: 0;
    padding: 0;
    overflow: hidden;
}
</style>
