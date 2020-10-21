<template>
  <BaseForm :object="object">

    <FormField label="Priority">
      <input v-model="object.properties.priority" type="number">
    </FormField>

    <FormField label="Condition">
      <input v-model="object.properties.condition" placeholder="@()if(){}{}" type="text">
    </FormField>

  </BaseForm>
</template>

<script>
import Form from '../skeletons/Form';
import BaseForm from './base';
import FormField from '../skeletons/FormField';
export default {
  components: {
    Form,
    BaseForm,
    FormField,
  },
  props:{
    object: {
      type: Object,
      required: true,
    }
  }
}
</script>
