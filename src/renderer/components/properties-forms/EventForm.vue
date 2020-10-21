<template>
  <BaseForm :object="object">

    <FormField label="Event clear">
      <select v-model="object.properties.clear">
        <option v-for="opt in eventClearOptions" :key="opt.value"
          :value="opt.value">{{ opt.text }}</option>
      </select>
    </FormField>

    <FormField label="Type">
      <RadioButtonGroup v-model="object.properties.type" :items="eventTypes" />
    </FormField>


  </BaseForm>
</template>

<script>
import Form from '../skeletons/Form';
import BaseForm from './base';
import FormField from '../skeletons/FormField';
import RadioButtonGroup from '../skeletons/RadioButtonGroup';
import { EventClear, EventType } from '../../my-diagram/EventNode';
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
    eventTypes: [
      {
        text: 'Signle Thread',
        value: EventType.SINGLE_THREAD
      },
      {
        text: 'Multi Thread',
        value: EventType.MULTI_THREAD
      }
    ],
    eventClearOptions: [
      {
        text: 'Manual',
        value: EventClear.MANUAL
      },
      {
        text: 'Upon Read',
        value: EventClear.READ
      },
      {
        text: 'Upon Task End',
        value: EventClear.END
      }
    ]
  })
}
</script>
