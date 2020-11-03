<template>
  <Form>
    <FormField label="Project Name">
      <input v-model="data.name" type="text" placeholder="Enter...">
    </FormField>
    <FormField label="Project Location" v-if="!modifyMode">
      <FileInput v-model="data.location" type="save" placeholder="N/A" buttonText="Browse..." />
    </FormField>
    <FormField label="Source File Location">
      <FileInput v-model="data.sourcesDir" type="directory" placeholder="N/A" buttonText="Browse..." />
    </FormField>
    <FormField label="Header File Location">
      <FileInput v-model="data.headersDir" type="directory" placeholder="N/A" buttonText="Browse..." />
    </FormField>
    <FormField label="Architecture">
      <RadioButtonGroup v-model="data.architecture" :items="architectureOptions" showSeparators />
    </FormField>
    <FormField label="Build Priority">
      <RadioButtonGroup v-model="data.build_priority" :items="buildPriorityOptions" showSeparators />
    </FormField>
  </Form>
</template>

<script>
import Form from '../skeletons/Form';
import FormField from '../skeletons/FormField';
import RadioButtonGroup from '../skeletons/RadioButtonGroup';
import FileInput from '../skeletons/FileInput';
export default {
  components: {
    Form,
    FormField,
    RadioButtonGroup,
    FileInput
  },
  props: {
    data: {
      type: Object,
      required: true,
    },
    modifyMode: {
      type: Boolean,
      default: false,
    }
  },
  data: () => ({
    architectureOptions: [
      { text: '8 bit', value: '8' },
      { text: '16 bit', value: '16' },
      { text: '32 bit', value: '32' },
    ],
    buildPriorityOptions: [
      { text: 'Memory', value: 'memory' },
      { text: 'Execution', value: 'execution' },
    ]
  })
}
</script>
