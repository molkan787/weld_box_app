<template>
  <Form>
    <div class="close-btn" @click="$emit('remove-click')">
      <CloseIcon :size="9"/>
    </div>
    <FormField label="Data name">
      <input v-model="data.data_name" type="text">
    </FormField>
    <FormField label="Data size">
      <input v-model="data.data_length" type="number" min="1">
    </FormField>
    <FormField label="Data type">
      <select v-model="data.data_type">
        <option value="i8">int8_t</option>
        <option value="i16">int16_t</option>
        <option value="i32">int32_t</option>
        <option value="u8">uint8_t</option>
        <option value="u16">uint16_t</option>
        <option value="u32">uint32_t</option>
        <option value="fl">float</option>
        <option value="db">double</option>
        <option value="ch">char</option>
        <option value="uch">unsignedchar</option>
      </select>
    </FormField>
  </Form>
</template>

<script>
import Form from '../skeletons/Form';
import FormField from '../skeletons/FormField';
import CloseIcon from '../icons/Close';
export default {
  components: {
    Form,
    FormField,
    CloseIcon
  },
  props: {
    data: {
      type: Object,
      required: true
    }
  }
}
</script>

<style lang="less" scoped>
.form-d1{
  padding: 6px 10px;
  .field{
    margin-bottom: 6px;
  }
}
.close-btn{
  display: inline-block;
  float: right;
  position: relative;
  top: -2px;
  cursor: pointer;
}
</style>
