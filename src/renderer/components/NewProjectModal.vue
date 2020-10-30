<template>
  <modal name="new-project-modal" height="auto" width="500" :clickToClose="false">
    <div class="header">Create Project</div>
    <div class="body">
        <Form>
          <FormField label="Project Name">
            <input v-model="setting.name" type="text" placeholder="Enter...">
          </FormField>
          <FormField label="Project Location">
            <FileInput v-model="setting.location" type="save" placeholder="N/A" buttonText="Browse..." />
          </FormField>
        </Form>
    </div>
    <div class="buttons">
        <button @click="cancelClick" style="width:120px" class="btn">Cancel</button>
        <button @click="okClick" style="width:120px" class="primary btn">Ok</button>
    </div>
  </modal>
</template>

<script>
import Form from './skeletons/Form';
import FormField from './skeletons/FormField';
import RadioButtonGroup from './skeletons/RadioButtonGroup';
import FileInput from './skeletons/FileInput';
import { projectsManager } from '../modules/projects-manager';
export default {
  components: {
    Form,
    FormField,
    RadioButtonGroup,
    FileInput
  },
  data:() => ({
    setting: {
      name: '',
      location: '',
    }
  }),
  methods: {
    open(){
      this.setting.name = '';
      this.setting.location = '';
      this.$modal.show('new-project-modal');
    },
    close(){
      this.$modal.hide('new-project-modal');
    },
    cancelClick(){
      this.close();
    },
    okClick(){
      if(this.validateForm()){
        projectsManager.create(this.setting);
        this.close();
      }
    },
    validateForm(){
      const f = this.setting;
      if(f.name.length < 2){
        alert('Please enter a valid Project Name.');
      }else if(f.location.length < 2){
        alert('Please specify Project Location');
      }else{
        return true;
      }
      return false;
    }
  }
}
</script>

<style lang="less" scoped>
.body{
  padding: 2px !important;
}
</style>
