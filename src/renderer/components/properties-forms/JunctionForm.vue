<template>
  <BaseForm :object="object" :showNameField="false"></BaseForm>
</template>

<script>
import BaseForm from './base';
export default {
  components: {
    BaseForm,
  },
  props:{
    object: {
      type: Object,
      required: true,
    }
  }
}
</script>
