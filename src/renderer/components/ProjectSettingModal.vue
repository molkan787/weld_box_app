<template>
  <modal name="new-project-modal" height="auto" width="500" :clickToClose="false">
    <div class="header" v-bind="{[USE_NATIVE_CLIPBOARD]: '1'}">
      {{ modifyMode ? 'Project Setting' : 'Create Project' }}
    </div>
    <div class="body" v-bind="{[USE_NATIVE_CLIPBOARD]: '1'}">
      <ProjectSettingForm :data="setting" :modifyMode="modifyMode" />
    </div>
    <div class="buttons" v-bind="{[USE_NATIVE_CLIPBOARD]: '1'}">
        <button @click="cancelClick" style="width:120px" class="btn">Cancel</button>
        <button @click="okClick" style="width:120px" class="primary btn">Ok</button>
    </div>
  </modal>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';
import { cloneObject } from '../diagram-core/utils';
import { projectsManager } from '../modules/projects-manager';
import ProjectSettingForm from './forms/ProjectSettingForm';
import { mapState } from 'vuex';
import { Dialog } from '../dialog';
import { USE_NATIVE_CLIPBOARD } from '../symbols';
export default {
  components: {
    ProjectSettingForm
  },
  computed: mapState(['projectSetting']),
  data:() => ({
    modifyMode: false,
    setting: {},
    USE_NATIVE_CLIPBOARD: USE_NATIVE_CLIPBOARD
  }),
  methods: {
    open(modifyMode){
      if(modifyMode){
        this.setting = cloneObject(this.projectSetting);
      }else{
        this.clearForm();
      }
      this.modifyMode = !!modifyMode;
      this.$modal.show('new-project-modal');
    },
    close(){
      this.$modal.hide('new-project-modal');
    },
    cancelClick(){
      this.close();
    },
    async okClick(){
      if(this.validateForm()){
        try {
          if(this.modifyMode){
            await projectsManager.setSetting(this.setting);
          }else{
            projectsManager.create(this.setting);
          }
          this.close();
        } catch (error) {
          console.error(error);
          Dialog.error('An error occured, Please try again')
        }
      }
    },
    validateForm(){
      const f = this.setting;
      if(f.name.length < 2){
        Dialog.error('Please enter a valid Project Name.');
      }else if(f.location.length < 2){
        Dialog.error('Please specify Project Location');
      }else if(f.sourcesDir.length < 2){
        Dialog.error('Please specify Source File Location');
      }else if(f.headersDir.length < 2){
        Dialog.error('Please specify Header File Location');
      }else{
        return true;
      }
      return false;
    },
    clearForm(){
      this.setting = {
        uuid: uuidv4(),
        name: '',
        location: '',
        sourcesDir: '',
        headersDir: '',
        architecture: '8',
        build_priority: 'execution',
        headers: '',
      };
    }
  }
}
</script>

<style lang="less" scoped>
.body{
  padding: 0 !important;
  margin: 2px !important;
  overflow-x: hidden;
  overflow-y: scroll;
  height: 470px;
}
.buttons{
  box-shadow: 0 0 6px #00000038;
}
</style>
