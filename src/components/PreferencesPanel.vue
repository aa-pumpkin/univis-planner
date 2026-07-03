<script setup lang="ts">
import { usePlannerStore } from '../stores/planner'; const store=usePlannerStore()
const toggles:[keyof typeof store.preferences,string][]=[['avoidFriday','Freitag möglichst frei'],['preferCompactWeek','Kompakte Tage'],['preferFreeDays','Mehr freie Tage'],['avoidLongGaps','Lange Pausen vermeiden'],['reserveLunchBreak','Mittagspause schützen']]
</script>
<template><section class="panel preferences">
  <div class="section-head"><div><span class="eyebrow">02 · PRÄFERENZEN</span><h2>Was ist dir wichtig?</h2></div></div>
  <div class="time-prefs"><label>Frühestens <input type="time" v-model="store.preferences.avoidBeforeTime"></label><label>Spätestens <input type="time" v-model="store.preferences.avoidAfterTime"></label></div>
  <label v-for="[key,label] in toggles" :key="key" class="toggle"><span>{{label}}</span><input type="checkbox" v-model="store.preferences[key]"><i></i></label>
</section></template>
