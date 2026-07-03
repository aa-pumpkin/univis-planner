<script setup lang="ts">
import { usePlannerStore } from '../stores/planner'; const store=usePlannerStore()
</script>
<template><section class="results">
  <div class="results-head"><h2>Varianten</h2></div>
  <div v-if="!store.candidates.length" class="empty"><b>Keine berechenbare Kombination</b><span>Entferne ein Modul oder löse eine feste Auswahl.</span></div>
  <div v-else class="candidate-row">
    <button v-for="(c,i) in store.candidates" :key="c.id" class="candidate" :class="{active:store.current?.id===c.id}" @click="store.selectCandidate(c.id)">
      <span class="rank">{{i===0?'Empfohlen':`Variante ${i+1}`}}</span><b>{{c.title}}</b><p>{{c.description}}</p>
      <span class="candidate-tag" v-for="tag in c.tags" :key="tag">{{tag}}</span>
      <span class="select-label">{{store.current?.id===c.id?'Ausgewählt':'Auswählen'}}</span>
    </button>
  </div>
</section></template>
