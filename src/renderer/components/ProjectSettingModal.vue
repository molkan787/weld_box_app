<template>
  <modal name="new-project-modal" height="auto" width="500" :clickToClose="false">
    <div class="header">
      {{ modifyMode ? 'Project Setting' : 'Create Project' }}
    </div>
    <div class="body">
      <ProjectSettingForm :data="setting" :modifyMode="modifyMode" />
    </div>
    <div class="buttons">
        <button @click="cancelClick" style="width:120px" class="btn">Cancel</button>
        <button @click="okClick" style="width:120px" class="primary btn">Ok</button>
    </div>
  </modal>
</template>

<script>
import { cloneObject } from '../diagram-core/utils';
import { projectsManager } from '../modules/projects-manager';
import ProjectSettingForm from './forms/ProjectSettingForm';
import { mapState } from 'vuex';
import { Dialog } from '../dialog';
export default {
  components: {
    ProjectSettingForm
  },
  computed: mapState(['projectSetting']),
  data:() => ({
    modifyMode: false,
    setting: {}
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
        name: '',
        location: '',
        sourcesDir: '',
        headersDir: '',
        architecture: '8',
        build_priority: 'memory',
      };
    }
  }
}
</script>

<style lang="less" scoped>
.body{
  padding: 2px !important;
}
</style>
