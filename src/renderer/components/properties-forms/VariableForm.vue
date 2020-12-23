<template>
  <BaseForm :object="object" objectType="Variable">

    <FormField label="Scope">
      <RadioButtonGroup v-model="object.properties.scope" :items="scopes" />
    </FormField>

    <FormField label="Data type">
      <select v-model="object.properties.type">
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

  </BaseForm>
</template>

<script>
import Form from '../skeletons/Form';
import BaseForm from './base';
import FormField from '../skeletons/FormField';
import RadioButtonGroup from '../skeletons/RadioButtonGroup';
import { EventDiscard, EventMode, EventType } from '../../my-diagram/EventNode';
import { VariableScope } from '../../my-diagram/VariableNode';
export default {
  components: {
    Form,
    BaseForm,
    FormField,
    RadioButtonGroup,
  },
  props:{
    object: {
      type: Object,
      required: true,
    }
  },
  data: () => ({
    scopes: [
      {
        text: 'Local',
        value: VariableScope.LOCAL
      },
      {
        text: 'Global',
        value: VariableScope.GLOBAL
      }
    ]
  })
}
</script>
