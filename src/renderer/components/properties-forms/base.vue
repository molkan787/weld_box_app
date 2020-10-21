<template>
  <Form>

    <FormField label="Object" disabled>
      <input class="capitalize" type="text" :value="object.what">
    </FormField>

    <FormField label="Name">
      <input type="text" v-model="object.name">
    </FormField>

    <slot></slot>

  </Form>
</template>

<script>
import Form from '../skeletons/Form';
import FormField from '../skeletons/FormField';
export default {
  components: {
    Form,
    FormField
  },
  props:{
    object: {
      type: Object,
      required: true,
    }
  }
}
</script>
