<template>
  <BaseForm :object="object">

    <FormField label="Queue length">
      <input v-model.number="object.properties.queue_length" type="number" min="1" max="1024">
    </FormField>

    <FormField label="Type">
      <RadioButtonGroup v-model="object.properties.type" :items="messageTypes" />
    </FormField>

    <FormField label="Data">
      <div class="data-items">

        <div v-for="(data, index) in object.body" :key="index" class="item">
          <MessageDataForm @remove-click="object.removeDataItem(index)" :data="data" />
        </div>

        <div @click="object.addDataItem()" class="item">
          <div class="add-button">
            <PlusSignIcon />
            Add data item
          </div>
        </div>

      </div>
    </FormField>

  </BaseForm>
</template>

<script>
import Form from '../skeletons/Form';
import BaseForm from './base';
import FormField from '../skeletons/FormField';
import RadioButtonGroup from '../skeletons/RadioButtonGroup';
import MessageDataForm from './MessageDataForm';
import PlusSignIcon from '../icons/PlusSign';
import { MessageType } from '../../my-diagram/MessageNode';
export default {
  components: {
    Form,
    BaseForm,
    FormField,
    RadioButtonGroup,
    MessageDataForm,
    PlusSignIcon
  },
  props:{
    object: {
      type: Object,
      required: true,
    }
  },
  data: () => ({
    messageTypes: [
      {
        text: 'Signle Thread',
        value: MessageType.SINGLE_THREAD
      },
      {
        text: 'Multi Thread',
        value: MessageType.MULTI_THREAD
      }
    ]
  })
}
</script>

<style lang="less" scoped>
.data-items{
  width: calc(100% + 12px);
  height: calc(100vh - 384px);
  overflow-x: hidden;
  overflow-y: scroll;
  box-sizing: border-box;
  margin-top: 4px;
  padding-right: 4px;

  & > .item{
    background-color: #222329;
    border-radius: 6px;
    margin-bottom: 6px;
    .add-button{
      padding: 10px;
      text-align: center;
      cursor: pointer;
      &:active{
        opacity: 0.6;
      }
    }
  }
}
</style>
