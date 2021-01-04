<template>
  <BaseForm :object="object">

    <FormField label="Discard Method">
      <select v-model="object.properties.discard">
        <option v-for="opt in discardClearOptions" :key="opt.value"
          :value="opt.value">{{ opt.text }}</option>
      </select>
    </FormField>

    <FormField label="Event Mode">
      <RadioButtonGroup v-model="object.properties.mode" :items="eventModes" />
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
import { EventDiscard, EventMode, EventType } from '../../my-diagram/EventNode';
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
    eventModes: [
      {
        text: 'Flag',
        value: EventMode.FLAG
      },
      {
        text: 'Counter',
        value: EventMode.COUNTER
      }
    ],
    discardClearOptions: [
      {
        text: 'Manual',
        value: EventDiscard.MANUAL
      },
      {
        text: 'Thread End',
        value: EventDiscard.THREAD
      },
      {
        text: 'After Read',
        value: EventDiscard.READ
      }
    ]
  })
}
</script>
