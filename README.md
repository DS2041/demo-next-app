SUPABASE DATABASE
---
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chess_games (
  id bigint NOT NULL DEFAULT nextval('chess_games_id_seq'::regclass),
  room_id character varying NOT NULL UNIQUE,
  timestamp timestamp with time zone DEFAULT now(),
  white_player character varying NOT NULL,
  black_player character varying NOT NULL,
  game_currency character varying DEFAULT 'USDT'::character varying,
  game_size numeric NOT NULL,
  winner character varying,
  loser character varying,
  game_status character varying DEFAULT 'active'::character varying,
  reason character varying,
  move_history jsonb DEFAULT '[]'::jsonb,
  total_moves integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  time_control_minutes integer DEFAULT 15,
  final_fen character varying,
  pgn_text text,
  game_result_type character varying,
  gamelink character varying,
  short_hash character varying UNIQUE,
  CONSTRAINT chess_games_pkey PRIMARY KEY (id)
);